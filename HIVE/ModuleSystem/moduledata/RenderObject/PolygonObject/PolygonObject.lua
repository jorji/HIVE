PolygonObject = {}
setmetatable(PolygonObject, {__index = HiveBaseModule})

PolygonObject.new = function (varname)
    local this = HiveBaseModule.new(varname)
    this.property = {
        mesh = nil,
        translate = {0,0,0},
        rotate = {0,0,0},
        scale = {0,0,0},
        shadername = 'polygon.frag',
        Uniform = {
            
        }
    }
    local pm = PolygonModel();
    this.pmodel = pm
    
    setmetatable(this, {__index=PolygonObject})
    return this
end

function PolygonObject:Do()    
    
    self:UpdateValue()
    local v = self.value    
    local pm = PolygonModel(); -- make new Model!
    self.pmodel = pm           -- replace
    
    if v.mesh then
	   pm:Create(v.mesh)
    end
	pm:SetTranslate(v.translate[1], v.translate[2], v.translate[3])
	pm:SetRotate(v.rotate[1], v.rotate[2], v.rotate[3])
	pm:SetScale(v.scale[1], v.scale[2], v.scale[3])
    
    if pm:GetShader() ~= v.shadername then
        clearShaderCache(v.shadername)
    end
	pm:SetShader(v.shadername)

	local uniforms = self.connection.Uniform
    if uniforms ~= nil then    
        for i,v in pairs(uniforms) do
            if v.type == 'vec4' then
                print('vec4[' .. v.name .. '] = (', v.value[1], v.value[2], v.value[3], v.value[4], ')')
                pm:SetVec4(v.name, v.value[1], v.value[2], v.value[3], v.value[4])
            end
            if v.type == 'vec3' then
                print('vec3[' .. v.name .. '] = (', v.value[1], v.value[2], v.value[3], ')')
                pm:SetVec3(v.name, v.value[1], v.value[2], v.value[3])
            end
            if v.type == 'vec2' then
                print('vec2[' .. v.name .. '] = (', v.value[1], v.value[2], ')')
                pm:SetVec2(v.name, v.value[1], v.value[2])
            end
            if v.type == 'float' then
                print('float[' .. v.name .. '] = (', v.value, ')')
                pm:SetFloat(v.name, v.value)
            end
            if v.type == 'int' then
                print('int[' .. v.name .. '] = (', v.value, ')')
                pm:SetInt(v.name, v.value)
            end
            if v.type == 'texture' then
                print('texture[' .. v.name .. '] = (', v.value, ')')
                pm:SetTexture(v.name, v.value)
            end
        end
    end
    
    pm:ClearExtraBuffer()
    local varyings = self.connection.Varying
    if varyings ~= nil then
        for i, v in pairs(varyings) do
            pm:AddExtraBuffer(v.name, v.value)
        end
    end
    
    return true
end

function PolygonObject:model()
    return self.pmodel;
end
